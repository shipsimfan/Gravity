// TODO:
//  1. Add collision detection and merging
//  2. Add mass slider

const DENSITY: number = 0.1;
const G: number = 10000;

var initial_mass: number = 100;

class Canvas {
    private element: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;

    private width: number;
    private height: number;

    constructor(id: string) {
        let element = document.getElementById(id);
        if (element === null)
            throw `Cannot find element with id "${id}"`;

        this.element = <HTMLCanvasElement>element;
        this.reset_size();

        let context = this.element.getContext("2d");
        if (context === null)
            throw `Cannot get "2d" context from the canvas`;

        this.context = <CanvasRenderingContext2D>context;
    }

    public get_width(): number {
        return this.width;
    }

    public get_height(): number {
        return this.height;
    }

    public start_frame() {
        this.reset_size();

        this.context.fillStyle = "black";
        this.context.fillRect(0, 0, this.width, this.height);
    }

    public draw_line(start: [number, number], end: [number, number], thickness: number, color: string) {
        this.context.strokeStyle = color;
        this.context.lineWidth = thickness;

        this.context.beginPath();
        this.context.moveTo(start[0], start[1]);
        this.context.lineTo(end[0], end[1]);
        this.context.stroke();
    }

    public draw_circle(position: [number, number], radius: number, color: string) {
        this.context.fillStyle = color;

        this.context.beginPath();
        this.context.ellipse(position[0], position[1], radius, radius, 0, 0, 2 * Math.PI);
        this.context.fill();
    }

    private reset_size() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.element.width = this.width;
        this.element.height = this.height;
    }
}

class Mass {
    private mass: number;
    private radius: number;
    private position: [number, number];

    private velocity: [number, number];

    constructor(mass: number, position: [number, number], velocity: [number, number]) {
        this.mass = mass;
        this.calculate_radius();

        this.position = position;
        this.velocity = velocity;
    }

    private calculate_radius() {
        this.radius = Math.cbrt(this.mass / (0.75 * Math.PI * DENSITY));
    }

    public render(canvas: Canvas) {
        canvas.draw_circle(this.position, this.radius, "blue");
    }

    public update_velocity(delta_time: number, other_mass: Mass) {
        let distance_2d = [
            other_mass.position[0] - this.position[0],
            other_mass.position[1] - this.position[1],
        ];

        let distance_squared = (distance_2d[0] * distance_2d[0]) + (distance_2d[1] * distance_2d[1]);
        let acceleration = ((G * other_mass.mass) / distance_squared) * delta_time;

        let distance = Math.sqrt(distance_squared);
        let direction = [
            distance_2d[0] / distance,
            distance_2d[1] / distance,
        ];

        this.velocity = [
            this.velocity[0] + acceleration * direction[0],
            this.velocity[1] + acceleration * direction[1],
        ];
    }

    public update_position(delta_time: number) {
        this.position = [this.position[0] + this.velocity[0] * delta_time, this.position[1] + this.velocity[1] * delta_time];
    }
}

class Universe {
    private masses: Mass[];

    constructor() {
        this.masses = [];
    }

    public spawn(mass: number, position: [number, number], velocity: [number, number]) {
        this.masses.push(new Mass(mass, position, velocity));
    }

    public update(delta_time: number) {
        for (let i = 0; i < this.masses.length; i++) {
            for (let j = 0; j < this.masses.length; j++) {
                if (i == j)
                    continue;

                this.masses[i].update_velocity(delta_time, this.masses[j]);
            }
        }

        for (let mass of this.masses)
            mass.update_position(delta_time);
    }

    public render(canvas: Canvas) {
        for (let mass of this.masses)
            mass.render(canvas);
    }
}

class App {
    private canvas: Canvas;

    private last_time_stamp: number;

    private click_start_point?: [number, number];
    private current_mouse_position: [number, number];

    private universe: Universe;

    constructor(canvas_id: string) {
        this.universe = new Universe();

        this.canvas = new Canvas(canvas_id);
        this.click_start_point = undefined;
        this.current_mouse_position = [0, 0];

        this.set_next_frame(0);

        document.body.onmousedown = (event) => this.on_mouse_down(event);
        document.body.onmouseup = () => this.on_mouse_up(true);
        document.body.onmouseleave = () => this.on_mouse_up(false);
        document.body.onmousemove = (event) => this.on_mouse_move(event);
    }

    private frame(time_stamp: number) {
        let delta_time = (time_stamp - this.last_time_stamp) / 1000;

        this.update(delta_time);
        this.render();

        this.set_next_frame(time_stamp);
    }

    private update(delta_time: number) {
        this.universe.update(delta_time);
    }

    private render() {
        this.canvas.start_frame();

        this.universe.render(this.canvas);

        if (typeof this.click_start_point !== "undefined")
            this.canvas.draw_line(this.click_start_point, this.current_mouse_position, 5, "red");
    }

    private on_mouse_down(event: MouseEvent) {
        this.click_start_point = [event.clientX, event.clientY];
    }

    private on_mouse_up(create: boolean) {
        if (!create)
            this.click_start_point = undefined;

        if (typeof this.click_start_point === "undefined")
            return;

        this.universe.spawn(initial_mass, this.click_start_point, [
            this.current_mouse_position[0] - this.click_start_point[0],
            this.current_mouse_position[1] - this.click_start_point[1],
        ]);

        this.click_start_point = undefined;
    }

    private on_mouse_move(event: MouseEvent) {
        this.current_mouse_position = [event.clientX, event.clientY];
    }

    private set_next_frame(time_stamp) {
        this.last_time_stamp = time_stamp;
        window.requestAnimationFrame((time_stamp) => this.frame(time_stamp));
    }
}

function main() {
    new App("canvas");
}
